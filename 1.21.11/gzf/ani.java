import com.google.common.collect.ImmutableList;
import com.mojang.brigadier.CommandDispatcher;
import com.mojang.logging.LogUtils;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import net.minecraft.server.MinecraftServer;
import org.slf4j.Logger;

public class ani {
   private static final Logger a = LogUtils.getLogger();
   private static final amo b = amo.b("tick");
   private static final amo c = amo.b("load");
   private final MinecraftServer d;
   private List<ht<ed>> e = ImmutableList.of();
   private boolean f;
   private anh g;

   public ani(MinecraftServer $$0, anh $$1) {
      this.d = $$0;
      this.g = $$1;
      this.b($$1);
   }

   public CommandDispatcher<ed> a() {
      return this.d.aF().a();
   }

   public void b() {
      if (this.d.aR().i()) {
         if (this.f) {
            this.f = false;
            Collection<ht<ed>> $$0 = this.g.b(c);
            this.a((Collection)$$0, (amo)c);
         }

         this.a((Collection)this.e, (amo)b);
      }
   }

   private void a(Collection<ht<ed>> $$0, amo $$1) {
      bzm var10000 = bzl.a();
      Objects.requireNonNull($$1);
      var10000.a($$1::toString);
      Iterator var3 = $$0.iterator();

      while(var3.hasNext()) {
         ht<ed> $$2 = (ht)var3.next();
         this.a($$2, this.c());
      }

      bzl.a().c();
   }

   public void a(ht<ed> $$0, ed $$1) {
      bzm $$2 = bzl.a();
      $$2.a(() -> {
         return "function " + String.valueOf($$0.a());
      });

      try {
         hv<ed> $$3 = $$0.a((uz)null, this.a());
         ee.a($$1, ($$2x) -> {
            hg.a($$2x, $$3, $$1, ea.a);
         });
      } catch (eg var9) {
      } catch (Exception var10) {
         a.warn("Failed to execute function {}", $$0.a(), var10);
      } finally {
         $$2.c();
      }

   }

   public void a(anh $$0) {
      this.g = $$0;
      this.b($$0);
   }

   private void b(anh $$0) {
      this.e = List.copyOf($$0.b(b));
      this.f = true;
   }

   public ed c() {
      return this.d.aG().a((bbn)bbh.c).a();
   }

   public Optional<ht<ed>> a(amo $$0) {
      return this.g.a($$0);
   }

   public List<ht<ed>> b(amo $$0) {
      return this.g.b($$0);
   }

   public Iterable<amo> d() {
      return this.g.a().keySet();
   }

   public Iterable<amo> e() {
      return this.g.b();
   }
}
