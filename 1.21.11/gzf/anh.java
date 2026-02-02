import com.google.common.collect.ImmutableMap;
import com.google.common.collect.Maps;
import com.google.common.collect.ImmutableMap.Builder;
import com.mojang.brigadier.CommandDispatcher;
import com.mojang.datafixers.util.Pair;
import com.mojang.logging.LogUtils;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Map.Entry;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.Executor;
import org.slf4j.Logger;

public class anh implements bat {
   private static final Logger b = LogUtils.getLogger();
   public static final amt<jq<ht<ed>>> a = amt.a(amo.b("function"));
   private static final amm c;
   private volatile Map<amo, ht<ed>> d = ImmutableMap.of();
   private final beg<ht<ed>> e;
   private volatile Map<amo, List<ht<ed>>> f;
   private final bbn g;
   private final CommandDispatcher<ed> h;

   public Optional<ht<ed>> a(amo $$0) {
      return Optional.ofNullable((ht)this.d.get($$0));
   }

   public Map<amo, ht<ed>> a() {
      return this.d;
   }

   public List<ht<ed>> b(amo $$0) {
      return (List)this.f.getOrDefault($$0, List.of());
   }

   public Iterable<amo> b() {
      return this.f.keySet();
   }

   public anh(bbn $$0, CommandDispatcher<ed> $$1) {
      this.e = new beg(($$0x, $$1x) -> {
         return this.a($$0x);
      }, mj.d(a));
      this.f = Map.of();
      this.g = $$0;
      this.h = $$1;
   }

   public CompletableFuture<Void> reload(bat.b $$0, Executor $$1, bat.a $$2, Executor $$3) {
      baz $$4 = $$0.a();
      CompletableFuture<Map<amo, List<beg.b>>> $$5 = CompletableFuture.supplyAsync(() -> {
         return this.e.a($$4);
      }, $$1);
      CompletableFuture<Map<amo, CompletableFuture<ht<ed>>>> $$6 = CompletableFuture.supplyAsync(() -> {
         return c.a($$4);
      }, $$1).thenCompose(($$1x) -> {
         Map<amo, CompletableFuture<ht<ed>>> $$2 = Maps.newHashMap();
         ed $$3 = ee.a(this.g);
         Iterator var5 = $$1x.entrySet().iterator();

         while(var5.hasNext()) {
            Entry<amo, bax> $$4 = (Entry)var5.next();
            amo $$5 = (amo)$$4.getKey();
            amo $$6 = c.b($$5);
            $$2.put($$6, CompletableFuture.supplyAsync(() -> {
               List<String> $$3x = a((bax)$$4.getValue());
               return ht.a($$6, this.h, $$3, $$3x);
            }, $$1));
         }

         CompletableFuture<?>[] $$7 = (CompletableFuture[])$$2.values().toArray(new CompletableFuture[0]);
         return CompletableFuture.allOf($$7).handle(($$1xx, $$2x) -> {
            return $$2;
         });
      });
      CompletableFuture var10000 = $$5.thenCombine($$6, Pair::of);
      Objects.requireNonNull($$2);
      return var10000.thenCompose($$2::wait).thenAcceptAsync(($$0x) -> {
         Map<amo, CompletableFuture<ht<ed>>> $$1 = (Map)$$0x.getSecond();
         Builder<amo, ht<ed>> $$2 = ImmutableMap.builder();
         $$1.forEach(($$1x, $$2x) -> {
            $$2x.handle(($$2xx, $$3) -> {
               if ($$3 != null) {
                  b.error("Failed to load function {}", $$1x, $$3);
               } else {
                  $$2.put($$1x, $$2xx);
               }

               return null;
            }).join();
         });
         this.d = $$2.build();
         this.f = this.e.a((Map)$$0x.getFirst());
      }, $$3);
   }

   private static List<String> a(bax $$0) {
      try {
         BufferedReader $$1 = $$0.e();

         List var2;
         try {
            var2 = $$1.lines().toList();
         } catch (Throwable var5) {
            if ($$1 != null) {
               try {
                  $$1.close();
               } catch (Throwable var4) {
                  var5.addSuppressed(var4);
               }
            }

            throw var5;
         }

         if ($$1 != null) {
            $$1.close();
         }

         return var2;
      } catch (IOException var6) {
         throw new CompletionException(var6);
      }
   }

   static {
      c = new amm(mj.c(a), ".mcfunction");
   }
}
