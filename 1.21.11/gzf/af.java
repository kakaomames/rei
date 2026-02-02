import com.google.common.collect.Sets;
import com.mojang.serialization.Codec;
import com.mojang.serialization.DataResult;
import it.unimi.dsi.fastutil.objects.ObjectOpenHashSet;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.function.Predicate;

public record af(List<List<String>> c) {
   public static final Codec<af> a;
   public static final af b;

   public af(wx $$0) {
      this($$0.a(($$0x) -> {
         return $$0x.a(wx::p);
      }));
   }

   public af(List<List<String>> param1) {
      this.c = $$0;
   }

   public void a(wx $$0) {
      $$0.a((Collection)this.c, (aaq)(($$0x, $$1) -> {
         $$0x.a((Collection)$$1, (aaq)(wx::a));
      }));
   }

   public static af a(Collection<String> $$0) {
      return new af($$0.stream().map(List::of).toList());
   }

   public static af b(Collection<String> $$0) {
      return new af(List.of(List.copyOf($$0)));
   }

   public int a() {
      return this.c.size();
   }

   public boolean a(Predicate<String> $$0) {
      if (this.c.isEmpty()) {
         return false;
      } else {
         Iterator var2 = this.c.iterator();

         List $$1;
         do {
            if (!var2.hasNext()) {
               return true;
            }

            $$1 = (List)var2.next();
         } while(a($$1, $$0));

         return false;
      }
   }

   public int b(Predicate<String> $$0) {
      int $$1 = 0;
      Iterator var3 = this.c.iterator();

      while(var3.hasNext()) {
         List<String> $$2 = (List)var3.next();
         if (a($$2, $$0)) {
            ++$$1;
         }
      }

      return $$1;
   }

   private static boolean a(List<String> $$0, Predicate<String> $$1) {
      Iterator var2 = $$0.iterator();

      String $$2;
      do {
         if (!var2.hasNext()) {
            return false;
         }

         $$2 = (String)var2.next();
      } while(!$$1.test($$2));

      return true;
   }

   public DataResult<af> a(Set<String> $$0) {
      Set<String> $$1 = new ObjectOpenHashSet();
      Iterator var3 = this.c.iterator();

      while(var3.hasNext()) {
         List<String> $$2 = (List)var3.next();
         if ($$2.isEmpty() && $$0.isEmpty()) {
            return DataResult.error(() -> {
               return "Requirement entry cannot be empty";
            });
         }

         $$1.addAll($$2);
      }

      if (!$$0.equals($$1)) {
         Set<String> $$3 = Sets.difference($$0, $$1);
         Set<String> $$4 = Sets.difference($$1, $$0);
         return DataResult.error(() -> {
            String var10000 = String.valueOf($$3);
            return "Advancement completion requirements did not exactly match specified criteria. Missing: " + var10000 + ". Unknown: " + String.valueOf($$4);
         });
      } else {
         return DataResult.success(this);
      }
   }

   public boolean b() {
      return this.c.isEmpty();
   }

   public String toString() {
      return this.c.toString();
   }

   public Set<String> c() {
      Set<String> $$0 = new ObjectOpenHashSet();
      Iterator var2 = this.c.iterator();

      while(var2.hasNext()) {
         List<String> $$1 = (List)var2.next();
         $$0.addAll($$1);
      }

      return $$0;
   }

   public List<List<String>> d() {
      return this.c;
   }

   static {
      a = Codec.STRING.listOf().listOf().xmap(af::new, af::d);
      b = new af(List.of());
   }

   public interface a {
      af.a a = af::a;
      af.a b = af::b;

      af create(Collection<String> var1);
   }
}
