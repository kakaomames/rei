import com.google.gson.JsonElement;
import com.mojang.logging.LogUtils;
import com.mojang.serialization.DynamicOps;
import com.mojang.serialization.JsonOps;
import com.mojang.serialization.Lifecycle;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.stream.Stream;
import org.slf4j.Logger;

public class and {
   private static final Logger a = LogUtils.getLogger();
   private static final jp b = new jp(Optional.empty(), Lifecycle.experimental());

   public static CompletableFuture<and.b> a(jk<anc> $$0, List<jq.a<?>> $$1, baz $$2, Executor $$3) {
      List<jf.b<?>> $$4 = beg.a($$0.b(anc.d), $$1);
      jf.a $$5 = jf.a.a($$4.stream());
      ams<JsonElement> $$6 = $$5.a((DynamicOps)JsonOps.INSTANCE);
      List<CompletableFuture<jz<?>>> $$7 = foc.a().map(($$3x) -> {
         return a($$3x, $$6, $$2, $$3);
      }).toList();
      CompletableFuture<List<jz<?>>> $$8 = bhs.c($$7);
      return $$8.thenApplyAsync(($$2x) -> {
         return a($$0, $$5, $$2x);
      }, $$3);
   }

   private static <T> CompletableFuture<jz<?>> a(foc<T> $$0, ams<JsonElement> $$1, baz $$2, Executor $$3) {
      return CompletableFuture.supplyAsync(() -> {
         jz<T> $$3 = new jl($$0.b(), Lifecycle.experimental());
         Map<amo, T> $$4 = new HashMap();
         bbd.a($$2, (amt)$$0.b(), $$1, $$0.c(), $$4);
         $$4.forEach(($$2x, $$3x) -> {
            $$3.a(amt.a($$0.b(), $$2x), $$3x, b);
         });
         beg.a((baz)$$2, (jz)$$3);
         return $$3;
      }, $$3);
   }

   private static and.b a(jk<anc> $$0, jf.a $$1, List<jz<?>> $$2) {
      jk<anc> $$3 = a($$0, $$2);
      jf.a $$4 = a((jf.a)$$1, (jf.a)$$3.a((Object)anc.d));
      a($$4);
      return new and.b($$3, $$4);
   }

   private static jf.a a(jf.a $$0, jf.a $$1) {
      return jf.a.a(Stream.concat($$0.c(), $$1.c()));
   }

   private static void a(jf.a $$0) {
      bgp.a $$1 = new bgp.a();
      fog $$2 = new fog($$1, fqw.q, $$0);
      foc.a().forEach(($$2x) -> {
         a($$2, $$2x, $$0);
      });
      $$1.a(($$0x, $$1x) -> {
         a.warn("Found loot table element validation problem in {}: {}", $$0x, $$1x.a());
      });
   }

   private static jk<anc> a(jk<anc> $$0, List<jz<?>> $$1) {
      return $$0.a((Object)anc.d, (jr.b[])((new jr.c($$1)).e()));
   }

   private static <T> void a(fog $$0, foc<T> $$1, jf.a $$2) {
      jf<T> $$3 = $$2.e($$1.b());
      $$3.c().forEach(($$2x) -> {
         $$1.a($$0, $$2x.h(), $$2x.a());
      });
   }

   public static record b(jk<anc> a, jf.a b) {
      public b(jk<anc> param1, jf.a param2) {
         this.a = $$0;
         this.b = $$1;
      }

      public jk<anc> a() {
         return this.a;
      }

      public jf.a b() {
         return this.b;
      }
   }

   public static class a {
      private final jf.a a;

      public a(jf.a $$0) {
         this.a = $$0;
      }

      public jf.a a() {
         return this.a;
      }

      public fof a(amt<fof> $$0) {
         return (fof)this.a.a(mj.bG).flatMap(($$1) -> {
            return $$1.a((amt)$$0);
         }).map(jd::a).orElse(fof.f);
      }
   }
}
