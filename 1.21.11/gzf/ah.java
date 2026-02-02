import com.mojang.logging.LogUtils;
import it.unimi.dsi.fastutil.objects.Object2ObjectOpenHashMap;
import it.unimi.dsi.fastutil.objects.ObjectLinkedOpenHashSet;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;

public class ah {
   private static final Logger a = LogUtils.getLogger();
   private final Map<amo, ad> b = new Object2ObjectOpenHashMap();
   private final Set<ad> c = new ObjectLinkedOpenHashSet();
   private final Set<ad> d = new ObjectLinkedOpenHashSet();
   @Nullable
   private ah.a e;

   private void a(ad $$0) {
      Iterator var2 = $$0.e().iterator();

      while(var2.hasNext()) {
         ad $$1 = (ad)var2.next();
         this.a($$1);
      }

      a.info("Forgot about advancement {}", $$0.b());
      this.b.remove($$0.b().a());
      if ($$0.c() == null) {
         this.c.remove($$0);
         if (this.e != null) {
            this.e.b($$0);
         }
      } else {
         this.d.remove($$0);
         if (this.e != null) {
            this.e.d($$0);
         }
      }

   }

   public void a(Set<amo> $$0) {
      Iterator var2 = $$0.iterator();

      while(var2.hasNext()) {
         amo $$1 = (amo)var2.next();
         ad $$2 = (ad)this.b.get($$1);
         if ($$2 == null) {
            a.warn("Told to remove advancement {} but I don't know what that is", $$1);
         } else {
            this.a($$2);
         }
      }

   }

   public void a(Collection<ac> $$0) {
      ArrayList $$1 = new ArrayList($$0);

      while(!$$1.isEmpty()) {
         if (!$$1.removeIf(this::b)) {
            a.error("Couldn't load advancements: {}", $$1);
            break;
         }
      }

      a.info("Loaded {} advancements", this.b.size());
   }

   private boolean b(ac $$0) {
      Optional<amo> $$1 = $$0.b().b();
      Map var10001 = this.b;
      Objects.requireNonNull(var10001);
      ad $$2 = (ad)$$1.map(var10001::get).orElse((Object)null);
      if ($$2 == null && $$1.isPresent()) {
         return false;
      } else {
         ad $$3 = new ad($$0, $$2);
         if ($$2 != null) {
            $$2.b($$3);
         }

         this.b.put($$0.a(), $$3);
         if ($$2 == null) {
            this.c.add($$3);
            if (this.e != null) {
               this.e.a($$3);
            }
         } else {
            this.d.add($$3);
            if (this.e != null) {
               this.e.c($$3);
            }
         }

         return true;
      }
   }

   public void a() {
      this.b.clear();
      this.c.clear();
      this.d.clear();
      if (this.e != null) {
         this.e.a();
      }

   }

   public Iterable<ad> b() {
      return this.c;
   }

   public Collection<ad> c() {
      return this.b.values();
   }

   @Nullable
   public ad a(amo $$0) {
      return (ad)this.b.get($$0);
   }

   @Nullable
   public ad a(ac $$0) {
      return (ad)this.b.get($$0.a());
   }

   public void a(@Nullable ah.a $$0) {
      this.e = $$0;
      if ($$0 != null) {
         Iterator var2 = this.c.iterator();

         ad $$2;
         while(var2.hasNext()) {
            $$2 = (ad)var2.next();
            $$0.a($$2);
         }

         var2 = this.d.iterator();

         while(var2.hasNext()) {
            $$2 = (ad)var2.next();
            $$0.c($$2);
         }
      }

   }

   public interface a {
      void a(ad var1);

      void b(ad var1);

      void c(ad var1);

      void d(ad var1);

      void a();
   }
}
